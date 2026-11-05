using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.ListView;

namespace TCCControleDeAcesso.Controllers
{
    public class EmpresasController
    {
        //////////////////////// parte do cadastro EMPRESAS
        Empresa empresaClass = new Empresa();
        public void InsertEmpresa()
        {
            try
            {
                //Banco.OpenConnection();

                Banco.Command = new MySqlCommand("insert into escolas(id, nome, email,senha) " +
                    "values(@id, @nome,@email, @senha)", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", empresaClass.Id);
                Banco.Command.Parameters.AddWithValue("@nome", empresaClass.Name.Trim());
                Banco.Command.Parameters.AddWithValue("@email", empresaClass.Email.Trim());
                Banco.Command.Parameters.AddWithValue("@senha", empresaClass.Senha.Trim());
                Banco.Command.ExecuteNonQuery();

                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Inserir Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void UpdateEmpresa()
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("update escolas set nome = @nome, email=@email, senha=@senha where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", empresaClass.Id);
                Banco.Command.Parameters.AddWithValue("@nome", empresaClass.Name.Trim());
                Banco.Command.Parameters.AddWithValue("@email", empresaClass.Email.Trim());
                Banco.Command.Parameters.AddWithValue("@senha", empresaClass.Senha.Trim());

                Banco.Command.ExecuteNonQuery();
                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Atualizar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void PullSenha()
        {
            try
            {
                //Banco.OpenConnection();
                string HashBanco = null;

                using (var cmd = new MySqlCommand("SELECT senha FROM escolas WHERE Email = @email ", Banco.Connection))
                {
                    cmd.Parameters.AddWithValue("@email", empresaClass.Email);

                    var result = cmd.ExecuteScalar();

                    if (result != null)
                    {
                        HashBanco = result.ToString();
                    }
                }
                //Banco.CloseConnection();
            }
            catch
            {
                MessageBox.Show("Algo deu errado na conexão com o banco.");
            }
        }
        //public void ChangePasswod()
        //{
        //    try
        //    {
        //        //Banco.OpenConnection();

        //        Banco.Command = new MySqlCommand("update escolas set senha=@senha where email=@email", Banco.Connection);
        //        Banco.Command.Parameters.AddWithValue("@senha", senha);
        //        Banco.Command.Parameters.AddWithValue("@email", email);

        //        Banco.Command.ExecuteNonQuery();

        //        //Banco.CloseConnection();
        //    }
        //    catch (Exception e)
        //    {
        //        MessageBox.Show("Erro", e.Message, MessageBoxButtons.OK, MessageBoxIcon.Error);
        //    }
        //}
        //Comentado pois será refatorado posteriormente
    }
}
