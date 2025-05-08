using System;
using System.Collections.Generic;
using System.Data;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using TCCControleDeAcesso.Controllers;


namespace TCCControleDeAcesso.Models
{
    
    public class CadastroAlunos
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string rm { get; set; }   
        public string serie { get; set; }
        public string idade { get; set; }

        public int idEscola { get; set; }
        
        public int idCurso { get; set; }
        public byte[] foto { get; set; }
        public UInt16 digital { get; set; }

        

        




        public void Insert()
        {

            try
            {
                Banco.OpenConnection();

                Banco.Command = new MySqlCommand("insert into Alunos(id, nome, rm,idade, serie, foto) " +
                    "values(@id, @nome, @rm, @idade, @serie, @foto)", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", Id);
                Banco.Command.Parameters.AddWithValue("@nome", Name);
                Banco.Command.Parameters.AddWithValue("@rm", rm);
                Banco.Command.Parameters.AddWithValue("@idade", idade);
                Banco.Command.Parameters.AddWithValue("@serie", serie);
                //Banco.Command.Parameters.AddWithValue("@idEscola",idEscola);
                //Banco.Command.Parameters.AddWithValue("@Curso", idCurso);
                Banco.Command.Parameters.Add("@foto", MySqlDbType.LongBlob).Value = foto;
                //Banco.Command.Parameters.AddWithValue("@digital", digital);
                Banco.Command.ExecuteNonQuery();


                Banco.CloseConnection();


            }
            catch (Exception e)
            {

                MessageBox.Show(e.Message, "Erro Ao Inserir Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);

            }
        }

        public void Delete()
        {
            try
            {
                Banco.OpenConnection();
                Banco.Command = new MySqlCommand("delete from Alunos where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", Id);
                Banco.Command.ExecuteNonQuery();
                Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Deletar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void Update()
        {
            try
            {
                Banco.OpenConnection();
                Banco.Command = new MySqlCommand("update Alunos set nome = @nome, rm = @rm, serie = @serie, idEscola = @idEscola, idCurso = @idCurso, foto = @foto, digital = @digital where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", Id);
                Banco.Command.Parameters.AddWithValue("@nome", Name);
                Banco.Command.Parameters.AddWithValue("@rm", rm);
                Banco.Command.Parameters.AddWithValue("@serie", serie);
                Banco.Command.Parameters.AddWithValue("@idEscola", idEscola);
                Banco.Command.Parameters.AddWithValue("@idCurso", idCurso);
                Banco.Command.Parameters.AddWithValue("@foto", foto);
                Banco.Command.Parameters.AddWithValue("@digital", digital);
                Banco.Command.ExecuteNonQuery();
                Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Atualizar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void ListStudents()
        {
            try
            {
                Banco.OpenConnection();
                Banco.DataAdapter = new MySqlDataAdapter("select a.id, a.nome, a.rm , a.serie, a.foto, a.digital from Alunos a inner join escolas on a.idEscola=id where a.id=@idEscola", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@idEscola", idEscola);
                Banco.datTable = new DataTable();
                Banco.DataAdapter.Fill(Banco.datTable);
                Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Listar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
