using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MySql.Data;
using MySql.Data.MySqlClient;

namespace TCCControleDeAcesso.Models
{
    public class Banco
    {

        public static MySqlConnection Connection { get; set; }
        public static MySqlCommand Command { get; set; }
        public static MySqlDataAdapter DataAdapter { get; set; }
        public static DataTable datTable { get; set; }


        public static void OpenConnection()
        {
            try
            {
                Connection = new MySqlConnection("server=localhost;port=3306;uid=root;pwd=1234;database=AccessControl;");




                Connection.Open();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Conectar com o Banco", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Console.WriteLine(e.ToString());
            }
        }

        public static void CloseConnection()
        {
            try
            {
                Connection.Close();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Fechar a Conexão com o Banco", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public static void CreateDatabase()
        {
            try
            {
                //abre a conexão com o banco de dados
                OpenConnection();



                Command = new MySqlCommand("CREATE DATABASE IF NOT EXISTS AccessControl", Connection);

                Command.ExecuteNonQuery();

                Command = new MySqlCommand("use accesscontrol", Connection);



                // Criação da tabela 'escolas'
                Command = new MySqlCommand("create table if not exists escolas" +
                    "(id integer auto_increment primary key," +
                    "nome varchar(50)," +
                    "email varchar(80)," +
                    "senha char(8))", Connection);
                Command.ExecuteNonQuery();

                // Criação da tabela 'cursos'
                Command = new MySqlCommand("create table if not exists cursos" +
                    "(id integer primary key auto_increment," +
                    "nome varchar(30)," +
                    "idEscola int," +
                    "foreign key (idEscola) references escolas (id))", Connection);
                Command.ExecuteNonQuery();


                // Criação da tabela 'alunos'
                Command = new MySqlCommand("create table if not exists alunos " +
                    "(id integer auto_increment primary key," +
                    "nome varchar(50)," +
                    "rm varchar(8)," +
                    "idade char(3)," +
                    "Curso varchar(30)," +
                    "idEscola int," +
                    "serie char(7)," +
                    "foto longblob, " +
                    "digital blob," +
                    "foreign key (idEscola) references escolas (id))", Connection);
                Command.ExecuteNonQuery();





                // Criação da tabela 'entradas'
                Command = new MySqlCommand("create table if not exists entradas " +
                    "(id integer primary key auto_increment," +
                    "idAluno int," +
                    "dataEntrada timestamp," +
                    "idEscola int," +
                    "foreign key(idAluno) references alunos(id)," +
                    "foreign key(idEscola) references escolas(id))", Connection);
                Command.ExecuteNonQuery();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Console.WriteLine(e.ToString());
            }
        }
    }
}
